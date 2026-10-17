dotnet rundotnet run# ============================================
# JDT TECHNOLOGICS - ASP.NET Core MVC en Google Cloud Run
# Colócalo en la carpeta del proyecto, junto al archivo .csproj
# ============================================

# Debe coincidir con <TargetFramework> de tu .csproj (net8.0 -> 8.0, net9.0 -> 9.0, etc.)
ARG DOTNET_VERSION=8.0

# ---------- Compilación ----------
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish --no-restore

# ---------- Ejecución ----------
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app
COPY --from=build /app/publish .

# Cloud Run envía el tráfico al puerto 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

# Arranca la aplicación sin tener que escribir el nombre del .dll
# (busca el único *.runtimeconfig.json de la carpeta publicada)
ENTRYPOINT ["sh", "-c", "exec dotnet \"$(basename \"$(ls /app/*.runtimeconfig.json | head -n 1)\" .runtimeconfig.json).dll\""]
